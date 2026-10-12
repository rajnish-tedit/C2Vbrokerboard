"use client";

import { useMemo, useState } from "react";

import { Card, CardHeader } from "@/components/ui/Card";
import { SearchInput, Select } from "@/components/ui/Controls";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { PolicyBadge } from "@/components/ui/PolicyBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatDateTime } from "@/lib/domain/dates";
import {
  referralStatusFor,
  REFERRAL_STATUS,
  type StatusMeta,
} from "@/lib/domain/status";
import { ATTRIBUTION_CASES, type AttributionCase } from "@/lib/mock";
import { useDemo } from "@/lib/store/DemoProvider";

const CASE_STATUS: Record<AttributionCase["status"], StatusMeta> = {
  attributed: {
    label: "Attributed",
    tone: "success",
    icon: "check",
    help: "Attribution created.",
  },
  kept_original: {
    label: "Kept original",
    tone: "info",
    icon: "check",
    help: "First valid attribution wins.",
  },
  rejected: {
    label: "Rejected",
    tone: "neutral",
    icon: "x",
    help: "No attribution created.",
  },
  needs_review: {
    label: "Needs review",
    tone: "warning",
    icon: "alert",
    help: "Business policy decision required.",
  },
  overridden: {
    label: "Admin override",
    tone: "brand",
    icon: "arrow",
    help: "Changed by an authorized Admin with an audit record.",
  },
};

const SCENARIO: Record<AttributionCase["scenario"], string> = {
  new_vendor: "New Vendor used valid link/code",
  existing_unattributed: "Existing unattributed Vendor used a link",
  already_attributed: "Vendor already attributed to another Broker",
  invalid_code: "Invalid or expired promo code",
  admin_override: "Admin changed Broker",
};

const SOURCE = {
  referral_link: "Referral link",
  promo_code: "Promo code",
  admin_override: "Admin override",
};

export function AdminReferralsView() {
  const { brokers } = useDemo();
  const [broker, setBroker] = useState("all");
  const [query, setQuery] = useState("");
  const brokerName = (id: string | null) =>
    brokers.find((b) => b.broker.id === id)?.broker.companyName ?? "—";

  const all = useMemo(
    () =>
      brokers.flatMap((d) =>
        d.referrals.map((r) => ({
          referral: r,
          broker: d.broker,
          vendor: d.vendors.find((v) => v.id === r.vendorId)!,
          sub: d.subscriptions.find((s) => s.vendorId === r.vendorId)!,
        })),
      ),
    [brokers],
  );
  const rows = all
    .filter(
      (r) =>
        (broker === "all" || r.broker.id === broker) &&
        (!query ||
          r.vendor.companyName.toLowerCase().includes(query.toLowerCase())),
    )
    .sort((a, b) => b.referral.referredAt.localeCompare(a.referral.referredAt));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Broker Referrals"
        description="Durable Broker ↔ Vendor attribution records, plus the edge cases that need a policy decision or were handled automatically."
        meta={<PolicyBadge label="First valid attribution wins · sample" />}
      />
      <Card>
        <CardHeader
          title="Attribution cases"
          description="Duplicate, invalid and override scenarios (spec §13.3)"
        />
        <DataTable
          caption="Attribution cases"
          rows={ATTRIBUTION_CASES}
          rowKey={(c) => c.id}
          columns={[
            {
              key: "when",
              header: "When",
              cell: (c) => (
                <span className="text-xs">{formatDateTime(c.occurredAt)}</span>
              ),
            },
            {
              key: "vendor",
              header: "Vendor",
              cell: (c) => (
                <span className="font-medium text-navy-950">
                  {c.vendorName}
                </span>
              ),
            },
            {
              key: "code",
              header: "Code used",
              cell: (c) => (
                <span className="font-mono text-xs">{c.attemptedCode}</span>
              ),
            },
            {
              key: "scenario",
              header: "Scenario",
              cell: (c) => SCENARIO[c.scenario],
              hideBelow: "md",
            },
            {
              key: "outcome",
              header: "Outcome",
              cell: (c) => (
                <span className="block max-w-md whitespace-normal text-xs text-slate-600">
                  {c.outcome}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              cell: (c) => <StatusBadge meta={CASE_STATUS[c.status]} />,
            },
            {
              key: "existing",
              header: "Owning Broker",
              cell: (c) =>
                brokerName(c.existingBrokerId ?? c.attemptedBrokerId),
              hideBelow: "lg",
            },
          ]}
        />
      </Card>
      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4">
          <p className="text-sm font-semibold text-navy-950">
            All attributions ({rows.length})
          </p>
          <div className="ml-auto flex flex-wrap items-end gap-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search Vendor"
              className="w-56"
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
          </div>
        </div>
        <DataTable
          caption="All attributions"
          rows={rows}
          rowKey={(r) => r.referral.id}
          pageSize={25}
          columns={[
            {
              key: "vendor",
              header: "Vendor",
              cell: (r) => (
                <span className="font-medium text-navy-950">
                  {r.vendor.companyName}
                </span>
              ),
            },
            {
              key: "broker",
              header: "Broker",
              cell: (r) => r.broker.companyName,
            },
            {
              key: "code",
              header: "Code",
              cell: (r) => (
                <span className="font-mono text-xs">
                  {r.referral.promoCode}
                </span>
              ),
              hideBelow: "md",
            },
            {
              key: "source",
              header: "Source",
              cell: (r) => SOURCE[r.referral.attributionSource],
            },
            {
              key: "date",
              header: "Attributed",
              cell: (r) => formatDate(r.referral.referredAt),
            },
            {
              key: "window",
              header: "Commission period",
              hideBelow: "lg",
              cell: (r) =>
                r.referral.commissionStartAt
                  ? `${formatDate(r.referral.commissionStartAt)} – ${formatDate(r.referral.commissionEndAt)}`
                  : "Not started",
            },
            {
              key: "status",
              header: "Status",
              cell: (r) => (
                <StatusBadge
                  meta={REFERRAL_STATUS[referralStatusFor(r.sub.status)]}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
