"use client";

import { Copy, Mail, ShieldCheck } from "lucide-react";

import { ReferralLinkCard } from "@/components/broker/ReferralLinkCard";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { PolicyBadge } from "@/components/ui/PolicyBadge";
import { useToast } from "@/components/ui/Toast";
import { formatMonth } from "@/lib/domain/dates";
import { recentMonths, referralFunnel } from "@/lib/domain/selectors";
import { useDemo } from "@/lib/store/DemoProvider";

const RULES = [
  {
    title: "First valid Broker attribution wins",
    body: "Once a Vendor is attributed to you, later links from other Brokers don't move commission ownership.",
  },
  {
    title: "Attribution is stored permanently at registration",
    body: "It does not depend on the browser session or the link being reopened later.",
  },
  {
    title: "Only an audited C2V Admin override can change it",
    body: "Every override requires a reason and is recorded in the audit log.",
  },
  {
    title: "Invalid or expired codes don't attribute",
    body: "The Vendor sees a validation message and can correct the code before registering.",
  },
];

export function ReferralsView() {
  const { broker: data } = useDemo();
  const toast = useToast();
  const funnel = referralFunnel(data);
  const months = recentMonths(6);
  const activity = months.map(
    (m) =>
      data.referralActivity.find((a) => a.month === m) ?? {
        month: m,
        linkClicks: 0,
        registrations: 0,
        paidConversions: 0,
      },
  );
  const conversion = funnel.registrations
    ? Math.round((funnel.paidConversions / funnel.registrations) * 100)
    : 0;

  const emailTemplate = `Hi,\n\nWe partner with Client2Vendor (C2V) to connect our ${data.agents.length}+ agents and their clients with trusted service Vendors. Register your company on C2V with our link to join the network:\n\n${data.broker.referralUrl}\n\nOr enter promo code ${data.broker.referralCode} when you sign up.\n\nThanks,\nMichael Carter\n${data.broker.companyName}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Referral Link & Promo Code"
        description="Share your unique link or code with Vendor companies. When they subscribe to an eligible paid plan, you earn commission."
      />

      <ReferralLinkCard broker={data.broker} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Link clicks"
          value={funnel.linkClicks}
          help="Visits to your referral URL. Click tracking is optional."
        />
        <KpiCard
          label="Registrations"
          value={funnel.registrations}
          help="Vendors who registered with your link or code."
        />
        <KpiCard
          label="Paid conversions"
          value={funnel.paidConversions}
          help="Vendors who paid at least one eligible invoice."
        />
        <KpiCard
          label="Conversion rate"
          value={`${conversion}%`}
          help="Paid conversions ÷ registrations."
          emphasis
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader
            title="Referral performance"
            description="Last 6 months"
          />
          <DataTable
            caption="Referral performance by month"
            columns={[
              {
                key: "month",
                header: "Month",
                cell: (a) => formatMonth(a.month),
              },
              {
                key: "clicks",
                header: "Link clicks",
                align: "right",
                cell: (a) => a.linkClicks,
              },
              {
                key: "reg",
                header: "Registrations",
                align: "right",
                cell: (a) => a.registrations,
              },
              {
                key: "paid",
                header: "Paid conversions",
                align: "right",
                cell: (a) => a.paidConversions,
              },
              {
                key: "rate",
                header: "Click → registration",
                align: "right",
                cell: (a) =>
                  a.linkClicks
                    ? `${Math.round((a.registrations / a.linkClicks) * 100)}%`
                    : "—",
              },
            ]}
            rows={[...activity].reverse()}
            rowKey={(a) => a.month}
          />
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title={
              <>
                <ShieldCheck
                  className="h-4 w-4 text-navy-600"
                  aria-hidden="true"
                />
                How attribution works
              </>
            }
            actions={<PolicyBadge />}
          />
          <ul className="space-y-4 p-5">
            {RULES.map((rule) => (
              <li key={rule.title}>
                <p className="text-sm font-medium text-navy-950">
                  {rule.title}
                </p>
                <p className="mt-0.5 text-sm text-slate-600">{rule.body}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={
            <>
              <Mail className="h-4 w-4 text-navy-600" aria-hidden="true" />
              Invitation email template
            </>
          }
          description="Copy and send to Vendor companies you work with"
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(emailTemplate);
                } catch {
                  // Clipboard can be blocked; the toast still confirms the action in the demo.
                }
                toast("Email template copied");
              }}
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Copy template
            </Button>
          }
        />
        <pre className="whitespace-pre-wrap p-5 font-sans text-sm text-slate-700">
          {emailTemplate}
        </pre>
      </Card>
    </div>
  );
}
