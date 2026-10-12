"use client";

import { Building2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import {
  brokerSummary,
  payoutExceptions,
} from "@/components/admin/adminSelectors";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatMoney, sum } from "@/lib/domain/money";
import {
  BANK_STATUS,
  STRIPE_STATUS,
  type StatusMeta,
} from "@/lib/domain/status";
import { useDemo } from "@/lib/store/DemoProvider";

const PENDING_SETUP: StatusMeta = {
  label: "Pending Setup",
  tone: "warning",
  icon: "pause",
  help: "Batch on hold until the Broker connects a Stripe payout account.",
};

export const LOGIN_STATUS: Record<string, StatusMeta> = {
  active: {
    label: "Active",
    tone: "success",
    icon: "check",
    help: "Broker user has activated portal login.",
  },
  invited: {
    label: "Invited",
    tone: "info",
    icon: "clock",
    help: "Invitation sent; login not yet activated.",
  },
  not_invited: {
    label: "Not Invited",
    tone: "neutral",
    icon: "dot",
    help: "No portal invitation sent.",
  },
  suspended: {
    label: "Suspended",
    tone: "danger",
    icon: "x",
    help: "Portal access suspended.",
  },
};

export function latestPayoutMeta(
  batch: {
    batchStatus: string;
    bankPayoutStatus: keyof typeof BANK_STATUS;
  } | null,
): StatusMeta | null {
  if (!batch) return null;
  return batch.batchStatus === "on_hold"
    ? PENDING_SETUP
    : BANK_STATUS[batch.bankPayoutStatus];
}

export function AdminBrokersView() {
  const { brokers } = useDemo();
  const router = useRouter();
  const rows = useMemo(() => brokers.map(brokerSummary), [brokers]);
  const exceptions = payoutExceptions(brokers);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brokers"
        description="All affiliate Brokers, their referral performance, current commission and payout health. Commission and settlement run automatically; this view is for monitoring and exceptions."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active Brokers"
          value={rows.length}
          icon={<Building2 className="h-4 w-4" />}
        />
        <KpiCard
          label="Referred Vendors"
          value={sum(rows.map((r) => r.kpis.referredVendors))}
          sub={`${sum(rows.map((r) => r.kpis.activePaidVendors))} active paid`}
        />
        <KpiCard
          label="September net commission"
          value={formatMoney(sum(rows.map((r) => r.currentCommissionCents)))}
          sub="All Brokers · settled Oct 05"
        />
        <KpiCard
          label="Payout exceptions"
          value={exceptions.length}
          sub={`${exceptions.filter((e) => e.severity === "critical").length} critical`}
          icon={<TriangleAlert className="h-4 w-4" />}
          href="/admin/exceptions"
          emphasis={exceptions.length > 0}
        />
      </div>
      <Card>
        <DataTable
          caption="Brokers"
          rows={rows}
          rowKey={(r) => r.data.broker.id}
          onRowClick={(r) => router.push(`/admin/brokers/${r.data.broker.id}`)}
          rowLabel={(r) => `Open ${r.data.broker.companyName}`}
          columns={[
            {
              key: "broker",
              header: "Broker",
              cell: (r) => (
                <span>
                  <span className="block font-medium text-navy-950">
                    {r.data.broker.companyName}
                  </span>
                  <span className="text-xs text-slate-500">
                    {r.data.broker.city} ·{" "}
                    <span className="font-mono">
                      {r.data.broker.referralCode}
                    </span>
                  </span>
                </span>
              ),
            },
            {
              key: "referred",
              header: "Referred Vendors",
              align: "right",
              cell: (r) => r.kpis.referredVendors,
            },
            {
              key: "paid",
              header: "Paid Vendors",
              align: "right",
              cell: (r) => r.kpis.activePaidVendors,
            },
            {
              key: "commission",
              header: "Current commission",
              align: "right",
              help: "Net commission for the latest settled month (September 2026).",
              cell: (r) => (
                <span className="font-semibold text-navy-950">
                  {formatMoney(r.currentCommissionCents)}
                </span>
              ),
            },
            {
              key: "setup",
              header: "Payout setup",
              cell: (r) => (
                <StatusBadge
                  meta={STRIPE_STATUS[r.data.payoutAccount.onboardingStatus]}
                />
              ),
            },
            {
              key: "latest",
              header: "Latest payout",
              cell: (r) => {
                const meta = latestPayoutMeta(r.latest);
                return meta ? <StatusBadge meta={meta} /> : "—";
              },
            },
            {
              key: "login",
              header: "Portal login",
              hideBelow: "2xl",
              cell: (r) => (
                <span className="flex items-center gap-1">
                  <StatusBadge meta={LOGIN_STATUS[r.data.broker.loginStatus]} />
                  {r.data.broker.payoutsPaused && (
                    <StatusBadge
                      meta={{
                        label: "Payouts paused",
                        tone: "warning",
                        icon: "pause",
                        help: "Admin paused payouts.",
                      }}
                    />
                  )}
                </span>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
