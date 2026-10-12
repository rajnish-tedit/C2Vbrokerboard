"use client";

import { Bot, Check } from "lucide-react";

import { Callout } from "@/components/ui/Callout";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { PolicyBadge } from "@/components/ui/PolicyBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { POLICY_DECISIONS } from "@/lib/domain/policy";
import type { StatusMeta } from "@/lib/domain/status";
import { useDemo } from "@/lib/store/DemoProvider";

const AWAITING: StatusMeta = {
  label: "Awaiting approval",
  tone: "warning",
  icon: "clock",
  help: "Sample value for the prototype. Needs customer approval.",
};
const OK: StatusMeta = {
  label: "Healthy",
  tone: "success",
  icon: "check",
  help: "Last run succeeded.",
};
const WARN: StatusMeta = {
  label: "Exceptions",
  tone: "warning",
  icon: "alert",
  help: "Run completed with items needing attention.",
};

const JOBS = [
  {
    name: "ProcessRecurlyPaymentEvent",
    schedule: "On webhook",
    lastRun: "Oct 28, 2026, 06:41 UTC",
    note: "Idempotent on Recurly invoice + event ID",
    status: OK,
  },
  {
    name: "CreateBrokerCommission",
    schedule: "On verified payment",
    lastRun: "Oct 28, 2026, 06:41 UTC",
    note: "One ledger entry per eligible payment",
    status: OK,
  },
  {
    name: "CreateCommissionAdjustment",
    schedule: "On refund / credit",
    lastRun: "Sep 20, 2026, 11:02 UTC",
    note: "Negative entry, never edits the original",
    status: OK,
  },
  {
    name: "MarkCommissionEligible",
    schedule: "Daily 02:00 UTC",
    lastRun: "Oct 28, 2026, 02:00 UTC",
    note: "Moves Pending → Eligible after 7-day hold",
    status: OK,
  },
  {
    name: "GenerateMonthlyBrokerPayouts",
    schedule: "1st of month 02:00 UTC",
    lastRun: "Oct 01, 2026, 02:00 UTC",
    note: "4 batches: 3 finalized, 1 on hold",
    status: WARN,
  },
  {
    name: "TransferBrokerPayout",
    schedule: "5th of month 10:00 UTC",
    lastRun: "Oct 05, 2026, 10:00 UTC",
    note: "Deterministic idempotency key per batch",
    status: OK,
  },
  {
    name: "SyncStripeConnectedAccountStatus",
    schedule: "Hourly + webhooks",
    lastRun: "Oct 28, 2026, 06:00 UTC",
    note: "2 accounts need attention",
    status: WARN,
  },
  {
    name: "SyncStripePayoutStatus",
    schedule: "Webhooks",
    lastRun: "Oct 07, 2026, 13:11 UTC",
    note: "1 bank payout failed (Northstar)",
    status: WARN,
  },
  {
    name: "SendBrokerFinancialNotifications",
    schedule: "On event",
    lastRun: "Oct 24, 2026, 15:12 UTC",
    note: "Statement, payout and setup alerts",
    status: OK,
  },
];

export function AdminConfigurationView() {
  const { brokers } = useDemo();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Commission Configuration"
        description="Program policy used by the automated commission engine. Every value below is a sample that needs customer approval before production."
      />
      <Callout tone="info" title="No routine manual finance work">
        Calculations, eligibility, monthly settlement and Stripe transfers run
        as background jobs. Admins configure policy and handle exceptions; they
        never total spreadsheets or send routine payments by hand.
      </Callout>

      <Card>
        <CardHeader title="Program policy" actions={<PolicyBadge />} />
        <DataTable
          caption="Program policy decisions"
          rows={POLICY_DECISIONS}
          rowKey={(p) => p.key}
          columns={[
            {
              key: "decision",
              header: "Decision",
              cell: (p) => (
                <span className="font-medium text-navy-950">{p.label}</span>
              ),
            },
            {
              key: "value",
              header: "Prototype sample / recommendation",
              cell: (p) => (
                <span className="block max-w-md whitespace-normal">
                  {p.sampleValue}
                  <span className="block text-xs text-slate-500">
                    {p.detail}
                  </span>
                </span>
              ),
            },
            {
              key: "spec",
              header: "Spec",
              cell: (p) => (
                <span className="text-xs text-slate-500">{p.specRef}</span>
              ),
              hideBelow: "md",
            },
            {
              key: "approval",
              header: "Approval",
              cell: () => <StatusBadge meta={AWAITING} />,
            },
          ]}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Per-Broker overrides"
            description="All Brokers use the program default today"
          />
          <ul className="divide-y divide-slate-100">
            {brokers.map((b) => (
              <li
                key={b.broker.id}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <span className="font-medium text-navy-950">
                  {b.broker.companyName}
                </span>
                <span className="flex items-center gap-2 text-slate-600">
                  <Check
                    className="h-4 w-4 text-emerald-600"
                    aria-hidden="true"
                  />
                  Default · {b.broker.defaultCommissionRateBps / 100}%
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader
            title={
              <>
                <Bot className="h-4 w-4 text-navy-600" aria-hidden="true" />
                Automation jobs
              </>
            }
            description="Future production background processing (spec §22.2), shown with simulated run history"
          />
          <DataTable
            caption="Automation jobs"
            rows={JOBS}
            rowKey={(j) => j.name}
            columns={[
              {
                key: "job",
                header: "Job",
                cell: (j) => (
                  <span className="block whitespace-normal">
                    <span className="block font-mono text-xs font-medium text-navy-950">
                      {j.name}
                    </span>
                    <span className="text-xs text-slate-500">{j.note}</span>
                  </span>
                ),
              },
              {
                key: "schedule",
                header: "Trigger",
                cell: (j) => <span className="text-xs">{j.schedule}</span>,
                hideBelow: "md",
              },
              {
                key: "last",
                header: "Last run",
                cell: (j) => <span className="text-xs">{j.lastRun}</span>,
                hideBelow: "2xl",
              },
              {
                key: "status",
                header: "Status",
                cell: (j) => <StatusBadge meta={j.status} />,
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
