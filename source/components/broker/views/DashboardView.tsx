"use client";

import {
  Briefcase,
  ChevronRight,
  Copy,
  QrCode,
  Sparkles,
  ThumbsUp,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AiImportDialog, QrDialog, ReferVendorDialog } from "@/components/broker/NetworkDialogs";
import { InviteAgentDrawer } from "@/components/broker/InviteAgentDrawer";
import { PayoutSetupAlert } from "@/components/broker/PayoutSetupAlert";
import { PayoutStatusTimeline } from "@/components/broker/PayoutStatusTimeline";
import { CommissionTrendChart } from "@/components/charts/CommissionTrendChart";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { InfoTip } from "@/components/ui/Tooltip";
import { formatDate, formatMonth } from "@/lib/domain/dates";
import { formatMoney } from "@/lib/domain/money";
import {
  type ActivityItem,
  BROKER_OFFICES,
  categoryCount,
  networkActivity,
  relativeTime,
  vendorCategories,
} from "@/lib/domain/network";
import { brokerKpis, monthlyCommissionSeries, recentMonths } from "@/lib/domain/selectors";
import { useDemo } from "@/lib/store/DemoProvider";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Small building blocks                                              */
/* ------------------------------------------------------------------ */

const PANEL = "rounded-2xl border border-slate-200 bg-white shadow-card";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function StatCard({
  label,
  value,
  note,
  help,
  icon,
  href,
}: {
  label: string;
  value: string;
  note: string;
  help: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href} className={cn(PANEL, "group block p-5 transition-shadow hover:shadow-md")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-navy-900">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          {icon}
        </span>
      </div>
      <p className="num mt-4 text-3xl font-semibold text-navy-950">{value}</p>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
        {note}
        <span onClick={(e) => e.preventDefault()}>
          <InfoTip content={help} />
        </span>
      </p>
    </Link>
  );
}

function RevenueShare() {
  return (
    <section className="flex flex-col rounded-2xl bg-gradient-to-b from-brand-800 to-brand-600 p-5 text-white shadow-card">
      <h2 className="text-base font-semibold">Your Revenue Share</h2>
      <svg viewBox="0 0 240 130" className="mx-auto mt-3 w-full max-w-[16rem]" role="img" aria-label="35 percent revenue share">
        <defs>
          <pattern id="gauge-stripes" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
            <rect width="14" height="14" fill="#FFC93C" />
            <rect width="6" height="14" fill="#F2B72B" />
          </pattern>
        </defs>
        <path d="M 14 120 A 106 106 0 0 1 226 120 L 188 120 A 68 68 0 0 0 52 120 Z" fill="url(#gauge-stripes)" stroke="#FFC93C" strokeWidth="2" strokeLinejoin="round" />
        <text x="120" y="108" textAnchor="middle" fontSize="40" fontWeight="700" fill="#fff" fontFamily="DM Sans, system-ui, sans-serif">
          35%
        </text>
      </svg>
      <p className="mt-4 text-[15px] font-medium leading-snug">
        Earn from eligible paid subscriptions in your broker network.
      </p>
      <Link href="/broker/referrals" className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-medium text-white/90 hover:text-white">
        How your 35% works
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

function ProfileCard({ onComplete, percent }: { onComplete: () => void; percent: number }) {
  return (
    <section className={cn(PANEL, "p-5")}>
      <h2 className="text-base font-semibold text-navy-950">Complete Your Profile</h2>
      <div className="mt-3 flex items-center gap-3">
        <div
          className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Profile completion"
        >
          <div className="h-full rounded-full bg-gradient-to-r from-brand-800 to-sun" style={{ width: `${percent}%` }} />
        </div>
        <span className="num text-xs font-bold text-navy-950">{percent}%</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {percent === 100 ? "Your company profile is complete." : "Add your company logo and office locations"}
      </p>
      {percent < 100 && (
        <button type="button" onClick={onComplete} className="mt-4 flex w-full items-center justify-between text-sm font-semibold text-brand-700 hover:underline">
          Complete Profile
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </section>
  );
}

const ACTIVITY_ICON: Record<ActivityItem["kind"], React.ReactNode> = {
  subscribed: <UserCheck className="h-4 w-4" />,
  agent_joined: <ThumbsUp className="h-4 w-4" />,
  vendor_joined: <UserCheck className="h-4 w-4" />,
  agent_invite: <UserPlus className="h-4 w-4" />,
  vendor_invite: <UserPlus className="h-4 w-4" />,
  import: <Sparkles className="h-4 w-4" />,
};

function RecentActivity({ items }: { items: ActivityItem[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? items.slice(0, 12) : items.slice(0, 3);
  return (
    <section className={cn(PANEL, "flex min-h-[18rem] flex-col p-5")}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-navy-950">Recent Activity</h2>
        {items.length > 3 && (
          <button type="button" onClick={() => setAll((v) => !v)} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            {all ? "Show less" : "View All"}
            <ChevronRight className={cn("h-4 w-4 transition-transform", all && "rotate-90")} aria-hidden="true" />
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6 text-center">
          <p className="max-w-[16rem] text-sm text-navy-900">
            Your invitations, referrals, and network updates will appear here.
          </p>
          <Link href="/broker/agents" className="text-sm font-semibold text-brand-700 hover:underline">
            View the Dashboard to Access All Data.
          </Link>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {shown.map((a) => (
            <li key={a.id} className="flex gap-3 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sun-50 text-olive">
                {ACTIVITY_ICON[a.kind]}
              </span>
              <span className="min-w-0">
                <span className="block text-sm text-navy-950">{a.text}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{relativeTime(a)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const BAR_COLORS = ["#1E3A7A", "#A9BCEB", "#3E5C9E", "#A8913B", "#FFC93C"];

function CategoryChart({ data, total }: { data: ReturnType<typeof vendorCategories>; total: number }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="grid gap-6 p-5 md:grid-cols-[minmax(12rem,16rem)_1fr]">
      <div className="flex flex-col justify-between gap-6">
        <div>
          <p className="num text-6xl font-bold leading-none text-navy-950">{total}</p>
          <p className="mt-2 text-sm text-slate-500">Total Vendors</p>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2.5 text-sm text-navy-950">
          {data.map((d, i) => (
            <li key={d.category} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} aria-hidden="true" />
              {d.category}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex h-64 items-end gap-3 sm:gap-4" role="img" aria-label={`Joined vendors by category: ${data.map((d) => `${d.category} ${Math.round(d.share * 100)} percent`).join(", ")}`}>
        {data.map((d, i) => {
          const h = Math.max(34, (d.count / max) * 100);
          return (
            <div key={d.category} className="relative flex min-w-0 flex-1 flex-col justify-end" style={{ height: `${h}%` }}>
              <div
                className="stripes relative flex h-full flex-col items-center justify-between rounded-t-2xl px-1 pb-2 pt-2 text-center text-white"
                style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
              >
                <span className="num rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-navy-950 shadow-sm">
                  {Math.round(d.share * 100)}%
                </span>
                {i === 0 && (
                  <span className="text-xs font-semibold leading-tight text-white">
                    <span className="num block text-sm">{d.count}</span>
                    <span className="block truncate">{d.category}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompleteProfileDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const [logo, setLogo] = useState("");
  const [offices, setOffices] = useState<Set<string>>(new Set(BROKER_OFFICES.map((o) => o.name)));
  const toggle = (n: string) =>
    setOffices((s) => {
      const x = new Set(s);
      if (x.has(n)) x.delete(n);
      else x.add(n);
      return x;
    });
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Complete your profile"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} disabled={offices.size === 0} className="bg-brand-600 hover:bg-brand-700">Save profile</Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label htmlFor="profile-logo" className="mb-1.5 block text-xs font-semibold text-navy-900">Company logo</label>
          <input id="profile-logo" type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0]?.name ?? "")} className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700" />
          {logo && <p className="mt-1 text-xs text-emerald-700">{logo} selected</p>}
        </div>
        <fieldset>
          <legend className="mb-1.5 text-xs font-semibold text-navy-900">Office locations</legend>
          <ul className="space-y-2">
            {BROKER_OFFICES.map((o) => (
              <li key={o.name}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                  <input type="checkbox" checked={offices.has(o.name)} onChange={() => toggle(o.name)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600" />
                  <span className="text-sm">
                    <span className="block font-medium text-navy-950">{o.branch}</span>
                    <span className="block text-xs text-slate-500">{o.address}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                          */
/* ------------------------------------------------------------------ */

export function DashboardView() {
  const demo = useDemo();
  const data = demo.broker;
  const toast = useToast();
  const kpis = brokerKpis(data);
  const [invite, setInvite] = useState(false);
  const [refer, setRefer] = useState(false);
  const [qr, setQr] = useState(false);
  const [profile, setProfile] = useState(false);
  const [importMode, setImportMode] = useState<"agents" | "vendors" | null>(null);
  const [tab, setTab] = useState<"commission" | "payout">("commission");

  const firstTime = data.vendors.length === 0;
  const connectedAgents = data.agents.filter((a) => a.status !== "invited").length;
  const categories = useMemo(() => vendorCategories(data), [data]);
  const series = useMemo(() => monthlyCommissionSeries(data, recentMonths(7)), [data]);
  const last = kpis.lastPayout;
  const profilePercent = demo.state.profileComplete ? 100 : 60;
  const link = `client2vendor.com/r/${data.broker.referralCode}`;

  const activity = useMemo<ActivityItem[]>(
    () => [
      ...demo.state.activity.map((a) => ({ id: a.id, kind: a.kind, text: a.text, at: a.at, live: true })),
      ...networkActivity(data),
    ],
    [demo.state.activity, data],
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://${link}`);
      toast("Referral link copied to clipboard");
    } catch {
      toast(`Referral link: https://${link}`);
    }
  };

  return (
    <div className="space-y-6">
      <PayoutSetupAlert data={data} />

      {/* Welcome */}
      <section className={cn(PANEL, "grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center")}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{greeting()}</p>
          <h1 className="mt-1 text-3xl font-bold text-navy-950">
            {firstTime ? "Welcome" : "Welcome back,"} {demo.user.first}!
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">Earn 35% of vendor subscription revenue.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => setRefer(true)} className="bg-brand-600 hover:bg-brand-700">
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Refer a Vendor
            </Button>
            <Button variant="secondary" onClick={() => setInvite(true)} className="border-brand-600 text-brand-700 hover:bg-brand-50">
              <QrCode className="h-4 w-4" aria-hidden="true" />
              Invite an Agent
            </Button>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:min-w-[28rem]">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Your referral link</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <p className="num min-w-0 break-all text-lg font-semibold text-navy-950">{link}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="gold" onClick={copyLink}>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                Copy
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setQr(true)}>
                <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
                QR code
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              label="Connected Agents"
              value={connectedAgents.toLocaleString("en-US")}
              note={connectedAgents ? "Connected to your broker network" : "No agents have joined your network yet."}
              help="Agents associated with your brokerage in C2V. Network visibility only; Agent subscriptions do not earn commission."
              icon={<Users className="h-4 w-4" />}
              href="/broker/agents"
            />
            <StatCard
              label="Vendors Joined"
              value={String(data.vendors.length)}
              note={data.vendors.length ? `Across ${categoryCount(data)} service categories.` : "No vendors have joined your network yet."}
              help="Vendors attributed to your referral link or promo code."
              icon={<Briefcase className="h-4 w-4" />}
              href="/broker/vendors"
            />
            <StatCard
              label="Available for Payouts"
              value={formatMoney(kpis.availableForPayoutCents)}
              note={firstTime ? "No eligible commission for payout yet." : `Next settlement ${formatDate(kpis.nextSettlementDate)}`}
              help="Eligible commission that has cleared the 7-day hold and will settle on the next payout date."
              icon={<Wallet className="h-4 w-4" />}
              href="/broker/commissions"
            />
          </div>

          {/* AI Import */}
          <section className={cn(PANEL, "p-5")}>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-900 to-brand-500 text-white">
                <Sparkles className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-navy-950">Grow Faster with AI Import</h2>
                <p className="text-sm text-slate-500">Import your contacts. Invitations run in the background.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {(
                [
                  { mode: "agents", icon: <UserPlus className="h-5 w-5" />, title: "Import Agent", body: "Bring your agent list into your broker network.", cta: "AI Import Agents" },
                  { mode: "vendors", icon: <Briefcase className="h-5 w-5" />, title: "Import Vendors", body: "Add vendor contacts and map their categories.", cta: "AI Import Vendors" },
                ] as const
              ).map((c) => (
                <div key={c.mode} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex gap-3">
                    <span className="mt-0.5 text-brand-600">{c.icon}</span>
                    <div>
                      <h3 className="text-base font-semibold text-navy-950">{c.title}</h3>
                      <p className="mt-0.5 text-sm text-slate-500">{c.body}</p>
                    </div>
                  </div>
                  <Button onClick={() => setImportMode(c.mode)} className="mt-4 bg-brand-600 hover:bg-brand-700">
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    {c.cta}
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* Vendors by category */}
          <section className={cn(PANEL, "overflow-hidden")}>
            <div className="flex items-start justify-between gap-3 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-navy-950">Joined Vendors by Category</h2>
                <p className="text-sm text-slate-500">
                  {firstTime ? "Your entire broker network" : `Top ${Math.min(5, categories.length)} of ${categoryCount(data)} service categories in your broker network`}
                </p>
              </div>
              {!firstTime && (
                <Link href="/broker/vendors" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                  View All
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </div>
            <div className="border-t border-slate-100">
              {firstTime ? (
                <div className="p-6">
                  <div className="flex flex-col items-center gap-4 rounded-xl border border-sun/60 bg-sun-50 px-6 py-10 text-center">
                    <p className="max-w-xs text-sm text-navy-950">Your vendor categories will appear here once vendors join your network.</p>
                    <Button onClick={() => setRefer(true)} className="bg-brand-600 hover:bg-brand-700">
                      <UserPlus className="h-4 w-4" aria-hidden="true" />
                      Refer a Vendor
                    </Button>
                  </div>
                </div>
              ) : (
                <CategoryChart data={categories} total={data.vendors.length} />
              )}
            </div>
          </section>

          {/* Earnings */}
          <section className={cn(PANEL, "overflow-hidden")}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <h2 className="text-lg font-semibold text-navy-950">Earnings</h2>
              <div role="tablist" aria-label="Earnings view" className="inline-flex rounded-full bg-slate-100 p-1 text-sm font-medium">
                {(
                  [
                    ["commission", "Commission"],
                    ["payout", "Latest payout"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={tab === key}
                    onClick={() => setTab(key)}
                    className={cn("rounded-full px-4 py-1.5 transition-colors", tab === key ? "bg-white text-navy-950 shadow-sm" : "text-slate-500 hover:text-navy-900")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 p-5">
              {firstTime ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Commission and payout details appear after your first referred Vendor subscribes.
                </p>
              ) : tab === "commission" ? (
                <>
                  <p className="mb-2 text-xs text-slate-500">Monthly net commission. Hatched bar is the current month in progress.</p>
                  <CommissionTrendChart
                    label="Monthly net commission"
                    data={series.map((s) => ({
                      month: s.month,
                      valueCents: s.netCents,
                      inProgress: s.inProgress,
                      note: s.inProgress ? "Settles Nov 05, 2026" : undefined,
                    }))}
                  />
                </>
              ) : last ? (
                <div className="grid gap-6 md:grid-cols-[14rem_1fr]">
                  <div>
                    <p className="text-xs text-slate-500">{formatMonth(last.periodMonth)} commission</p>
                    <p className="num mt-1 text-3xl font-semibold text-navy-950">{formatMoney(last.netPayoutCents)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Net payout · {data.payoutAccount.bankName ?? "Bank"} {data.payoutAccount.maskedBankDisplay}
                    </p>
                    <Link href={`/broker/payouts/${last.id}`} className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
                      View statement
                    </Link>
                  </div>
                  <PayoutStatusTimeline batch={last} compact />
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-slate-500">No payouts yet.</p>
              )}
            </div>
          </section>
        </div>

        {/* Right rail */}
        <aside className="min-w-0 space-y-6">
          <ProfileCard percent={profilePercent} onComplete={() => setProfile(true)} />
          <RevenueShare />
          <RecentActivity items={activity} />
        </aside>
      </div>

      <InviteAgentDrawer open={invite} onClose={() => setInvite(false)} />
      <ReferVendorDialog open={refer} onClose={() => setRefer(false)} />
      <QrDialog open={qr} onClose={() => setQr(false)} url={`https://${link}`} />
      <AiImportDialog mode={importMode} onClose={() => setImportMode(null)} />
      <CompleteProfileDialog
        open={profile}
        onClose={() => setProfile(false)}
        onSave={() => {
          demo.completeProfile();
          setProfile(false);
          toast("Profile updated");
        }}
      />
    </div>
  );
}
