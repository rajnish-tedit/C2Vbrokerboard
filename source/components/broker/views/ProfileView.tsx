"use client";

import { Building2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { DescriptionList } from "@/components/ui/DescriptionList";
import { PageHeader } from "@/components/ui/PageHeader";
import { PolicyBadge } from "@/components/ui/PolicyBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/domain/dates";
import { POLICY_DECISIONS } from "@/lib/domain/policy";
import type { BrokerUser } from "@/lib/domain/types";
import { useDemo } from "@/lib/store/DemoProvider";

const USER_STATUS = {
  active: {
    label: "Active",
    tone: "success",
    icon: "check",
    help: "Can sign in to the Broker Portal.",
  },
  invited: {
    label: "Invited",
    tone: "info",
    icon: "clock",
    help: "Invitation sent.",
  },
  not_activated: {
    label: "Not Activated",
    tone: "warning",
    icon: "alert",
    help: "Invitation not accepted yet.",
  },
} as const;

const ROLE = { owner: "Owner", finance: "Finance", viewer: "Viewer" };

export function ProfileView() {
  const { broker: data } = useDemo();
  const toast = useToast();
  const me = data.users[0];
  const b = data.broker;
  const policy = POLICY_DECISIONS.filter((p) =>
    ["rate", "duration", "hold", "settlement", "base", "refunds"].includes(
      p.key,
    ),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your brokerage, your user account and the commission policy that applies to you."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={
              <>
                <Building2
                  className="h-4 w-4 text-navy-600"
                  aria-hidden="true"
                />
                Brokerage
              </>
            }
          />
          <div className="px-5 py-2">
            <DescriptionList
              items={[
                { term: "Company", value: b.companyName },
                { term: "Location", value: b.city },
                {
                  term: "Affiliate partner since",
                  value: formatDate(b.joinedAt),
                },
                {
                  term: "Promo code",
                  value: <span className="font-mono">{b.referralCode}</span>,
                },
                {
                  term: "Referral link",
                  value: (
                    <span className="break-all font-mono text-xs">
                      {b.referralUrl}
                    </span>
                  ),
                },
                { term: "Portal access", value: "Active" },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader
            title={
              <>
                <UserRound
                  className="h-4 w-4 text-navy-600"
                  aria-hidden="true"
                />
                Your account
              </>
            }
            actions={
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  toast("Password change is simulated in this prototype")
                }
              >
                Change password
              </Button>
            }
          />
          <div className="px-5 py-2">
            <DescriptionList
              items={[
                { term: "Name", value: me.name },
                { term: "Email", value: me.email },
                { term: "Phone", value: me.phone },
                { term: "Role", value: ROLE[me.role] },
                { term: "Last sign-in", value: formatDate(me.lastLoginAt) },
              ]}
            />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Team members"
          description="People from your brokerage with Broker Portal access"
        />
        <DataTable<BrokerUser>
          caption="Team members"
          rows={data.users}
          rowKey={(u) => u.id}
          columns={[
            {
              key: "name",
              header: "Name",
              cell: (u) => (
                <span className="font-medium text-navy-950">{u.name}</span>
              ),
            },
            { key: "email", header: "Email", cell: (u) => u.email },
            { key: "role", header: "Role", cell: (u) => ROLE[u.role] },
            {
              key: "status",
              header: "Status",
              cell: (u) => <StatusBadge meta={USER_STATUS[u.status]} />,
            },
            {
              key: "last",
              header: "Last sign-in",
              cell: (u) => formatDate(u.lastLoginAt),
              hideBelow: "sm",
            },
          ]}
        />
      </Card>

      <Card>
        <CardHeader
          title="Your commission policy"
          description="Read-only. Set by C2V under your affiliate agreement."
          actions={<PolicyBadge />}
        />
        <div className="px-5 py-2">
          <DescriptionList
            items={policy.map((p) => ({
              term: p.label,
              value: p.sampleValue,
              help: p.detail,
            }))}
          />
        </div>
      </Card>
    </div>
  );
}
