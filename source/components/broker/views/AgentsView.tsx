"use client";

import { Calendar, Search, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { InviteAgentDrawer } from "@/components/broker/InviteAgentDrawer";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { formatMonth } from "@/lib/domain/dates";
import { formatMoney } from "@/lib/domain/money";
import {
  AGENT_DISPLAY,
  type AgentDisplayStatus,
  type AgentRow,
  agentRows,
  agentSummary,
} from "@/lib/domain/network";
import { recentMonths } from "@/lib/domain/selectors";
import { useDemo } from "@/lib/store/DemoProvider";
import { cn } from "@/lib/utils";

type Sort = "recent" | "earnings" | "referrals" | "name";

export function StatusPill({ status }: { status: AgentDisplayStatus }) {
  const m = AGENT_DISPLAY[status];
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", m.className)}>
      {m.label}
    </span>
  );
}

function formatJoined(date: string) {
  return new Date(`${date}T00:00:00Z`)
    .toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
    .replace(/^(\w+) (\d+), (\d+)$/, (_, m: string, d: string, y: string) => `${d} ${m.toUpperCase()}, ${y}`);
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  icon,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">{label}</label>
      {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("field h-11 min-w-[8.5rem] bg-white py-0 pr-9 text-sm", icon && "pl-9")}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function AgentsView() {
  const { broker: data } = useDemo();
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<"connected" | "referrals">("connected");
  const [office, setOffice] = useState("all");
  const [status, setStatus] = useState("all");
  const [month, setMonth] = useState("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [query, setQuery] = useState("");
  const [invite, setInvite] = useState(false);

  const summary = agentSummary(data);
  const rows = useMemo(() => agentRows(data, month === "all" ? "all" : month), [data, month]);
  const offices = useMemo(() => Array.from(new Set(data.agents.map((a) => a.office))).sort(), [data]);
  const months = useMemo(() => recentMonths(7).slice().reverse(), []);

  const activeFilters = [office !== "all", status !== "all", month !== "all"].filter(Boolean).length;
  const clear = () => {
    setOffice("all");
    setStatus("all");
    setMonth("all");
    setSort("recent");
    setQuery("");
  };

  const q = query.trim().toLowerCase();
  const connected = useMemo(() => {
    const list = rows.filter(
      (r) =>
        r.display !== "invited" &&
        (office === "all" || r.agent.office === office) &&
        (status === "all" || r.display === status) &&
        (!q || r.agent.name.toLowerCase().includes(q) || r.agent.email.toLowerCase().includes(q) || r.agent.office.toLowerCase().includes(q)),
    );
    const by: Record<Sort, (a: AgentRow, b: AgentRow) => number> = {
      recent: (a, b) => b.agent.joinedAt.localeCompare(a.agent.joinedAt),
      earnings: (a, b) => b.earningsCents - a.earningsCents,
      referrals: (a, b) => b.referrals - a.referrals,
      name: (a, b) => a.agent.name.localeCompare(b.agent.name),
    };
    return list.sort(by[sort]);
  }, [rows, office, status, q, sort]);

  const invited = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.display === "invited" &&
          (office === "all" || r.agent.office === office) &&
          (!q || r.agent.name.toLowerCase().includes(q) || r.agent.email.toLowerCase().includes(q)),
      ),
    [rows, office, q],
  );

  const columns: Column<AgentRow>[] = [
    {
      key: "agent",
      header: "Agent",
      cell: (r) => (
        <span className="flex items-center gap-3">
          <Avatar name={r.agent.name} />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold text-navy-950">{r.agent.name}</span>
            <span className="block truncate text-xs text-slate-500">{r.agent.email}</span>
          </span>
        </span>
      ),
    },
    { key: "joined", header: "Joined", cell: (r) => <span className="num text-slate-600">{formatJoined(r.agent.joinedAt)}</span>, hideBelow: "md" },
    { key: "status", header: "Status", cell: (r) => <StatusPill status={r.display} /> },
    { key: "referrals", header: "Referrals", cell: (r) => <span className="num font-bold text-navy-950">{r.referrals}</span>, hideBelow: "sm" },
    { key: "vendors", header: "Vendors", cell: (r) => <span className="num font-bold text-navy-950">{r.vendors}</span>, hideBelow: "lg" },
    { key: "tx", header: "Transactions", cell: (r) => <span className="num font-bold text-navy-950">{r.transactions}</span>, hideBelow: "lg" },
    {
      key: "earn",
      header: "Broker earnings",
      cell: (r) => <span className="num font-bold text-navy-950">{formatMoney(r.earningsCents)}</span>,
    },
  ];

  const inviteColumns: Column<AgentRow>[] = [
    {
      key: "agent",
      header: "Agent",
      cell: (r) => (
        <span className="flex items-center gap-3">
          <Avatar name={r.agent.name} />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold text-navy-950">{r.agent.name}</span>
            <span className="block truncate text-xs text-slate-500">{r.agent.email}</span>
          </span>
        </span>
      ),
    },
    { key: "office", header: "Office", cell: (r) => r.agent.office, hideBelow: "md" },
    { key: "sent", header: "Invited", cell: (r) => <span className="num text-slate-600">{formatJoined(r.agent.joinedAt)}</span>, hideBelow: "sm" },
    { key: "status", header: "Status", cell: () => <StatusPill status="invited" /> },
    {
      key: "act",
      header: "",
      align: "right",
      cell: (r) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            toast(`Invitation re-sent to ${r.agent.name}`);
          }}
        >
          Resend invite
        </Button>
      ),
    },
  ];

  const stats = [
    { label: "Total Agents", value: summary.total, note: `Across ${summary.offices} offices` },
    { label: "Active Agents", value: summary.active, note: "Currently active" },
    { label: "New This Month", value: summary.newThisMonth, note: "Successfully connected" },
    { label: "Inactive Agents", value: summary.inactive, note: "Need re-engagement" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <h1 className="text-4xl font-bold tracking-tight text-navy-950">Connected Agents</h1>
          <p className="mt-3 text-[15px] text-slate-600">Your brokerage&apos;s C2V agent network. Separate from vendor Revenues.</p>
        </div>
        <dl className="grid grid-cols-2 divide-slate-200 sm:grid-cols-4 sm:divide-x">
          {stats.map((s) => (
            <div key={s.label} className="px-5 py-2 first:pl-0 sm:py-0">
              <dt className="text-sm text-slate-500">{s.label}</dt>
              <dd className="num mt-1 text-2xl font-bold text-navy-900">{s.value.toLocaleString("en-US")}</dd>
              <p className="mt-0.5 text-xs text-slate-500">{s.note}</p>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <span className="flex items-center gap-2 px-2 text-sm font-semibold text-navy-950">
          Active filters
          <span className="num flex h-5 min-w-5 items-center justify-center rounded-full bg-sun px-1.5 text-xs font-bold text-navy-950">{activeFilters}</span>
        </span>
        <FilterSelect id="f-office" label="Office" value={office} onChange={setOffice} options={[{ value: "all", label: "Office" }, ...offices.map((o) => ({ value: o, label: o }))]} />
        <FilterSelect
          id="f-status"
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "Status" },
            { value: "top_performer", label: "Top Performer" },
            { value: "active", label: "Active" },
            { value: "new", label: "New" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
        <FilterSelect
          id="f-month"
          label="Month"
          value={month}
          onChange={setMonth}
          icon={<Calendar className="h-4 w-4" aria-hidden="true" />}
          options={[{ value: "all", label: "All time" }, ...months.map((m) => ({ value: m, label: formatMonth(m) }))]}
        />
        <FilterSelect
          id="f-sort"
          label="Sort"
          value={sort}
          onChange={(v) => setSort(v as Sort)}
          options={[
            { value: "recent", label: "Sort: Most Recent" },
            { value: "earnings", label: "Sort: Top Earnings" },
            { value: "referrals", label: "Sort: Most Referrals" },
            { value: "name", label: "Sort: Name A–Z" },
          ]}
        />
        <button type="button" onClick={clear} className="text-sm font-semibold text-brand-700 hover:underline">
          Clear Filter
        </button>
        <Button onClick={() => setInvite(true)} className="ml-auto bg-brand-600 hover:bg-brand-700">
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Invite Agent
        </Button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center gap-4 p-4">
          <div role="tablist" aria-label="Agent lists" className="inline-flex rounded-lg bg-slate-100 p-1 text-sm font-semibold">
            {(
              [
                ["connected", "Connected Agents", connected.length],
                ["referrals", "Agent Referrals", invited.length],
              ] as const
            ).map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn("rounded-md px-4 py-2 transition-colors", tab === key ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 hover:text-navy-950")}
              >
                {label}
                <span className={cn("num ml-2 rounded-full px-1.5 text-[11px]", tab === key ? "bg-white/20" : "bg-white text-slate-500")}>{count}</span>
              </button>
            ))}
          </div>
          <label className="relative ml-auto block w-full sm:w-72">
            <span className="sr-only">Search name, brokerage, email</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="agents-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, brokerage, email…"
              className="field h-10 pl-9"
            />
          </label>
        </div>
        {tab === "connected" ? (
          <DataTable
            caption="Connected Agents"
            columns={columns}
            rows={connected}
            rowKey={(r) => r.agent.id}
            onRowClick={(r) => router.push(`/broker/agents/${r.agent.id}`)}
            rowLabel={(r) => `Open ${r.agent.name}`}
            pageSize={10}
            empty={
              <EmptyState
                icon={<Users className="h-5 w-5" />}
                title={data.agents.length === 0 ? "No agents have joined yet" : "No agents match these filters"}
                body={data.agents.length === 0 ? "Invite agents from your brokerage and they will appear here once they connect." : "Try clearing a filter or changing your search."}
              />
            }
          />
        ) : (
          <DataTable
            caption="Agent Referrals"
            columns={inviteColumns}
            rows={invited}
            rowKey={(r) => r.agent.id}
            pageSize={10}
            empty={
              <EmptyState
                icon={<UserPlus className="h-5 w-5" />}
                title="No pending invitations"
                body="Agents you invite show up here until they accept."
              />
            }
          />
        )}
      </section>

      <InviteAgentDrawer open={invite} onClose={() => setInvite(false)} onSent={() => setTab("referrals")} />
    </div>
  );
}
