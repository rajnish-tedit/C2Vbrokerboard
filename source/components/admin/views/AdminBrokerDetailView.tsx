"use client";

import {
  Building2,
  Mail,
  PauseCircle,
  PlayCircle,
  Shuffle,
  SlidersHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  brokerSummary,
  payoutExceptions,
} from "@/components/admin/adminSelectors";
import { ReasonModal } from "@/components/admin/ReasonModal";
import { AuditLogTable } from "@/components/admin/AuditLogTable";
import {
  LOGIN_STATUS,
  latestPayoutMeta,
} from "@/components/admin/views/AdminBrokersView";
import { CommissionTransactionDrawer } from "@/components/broker/CommissionTransactionDrawer";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Card, CardHeader } from "@/components/ui/Card";
import { FilterPills, Select } from "@/components/ui/Controls";
import { DataTable } from "@/components/ui/DataTable";
import { DescriptionList } from "@/components/ui/DescriptionList";
import { EmptyState } from "@/components/ui/EmptyState";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { PolicyBadge } from "@/components/ui/PolicyBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import {
  formatDate,
  formatDateTime,
  formatMonth,
  formatShortDate,
} from "@/lib/domain/dates";
import { formatMoney } from "@/lib/domain/money";
import { COMMISSION_POLICY, PLANS } from "@/lib/domain/policy";
import { vendorRows } from "@/lib/domain/selectors";
import {
  BANK_STATUS,
  BATCH_STATUS,
  COMMISSION_STATUS,
  COMMISSION_TYPE,
  REFERRAL_STATUS,
  STRIPE_STATUS,
  TRANSFER_STATUS,
} from "@/lib/domain/status";
import { useDemo } from "@/lib/store/DemoProvider";

type Tab = "overview" | "vendors" | "ledger" | "payouts" | "audit";
type Action = null | "pause" | "policy" | "attribution" | "invite";

export function AdminBrokerDetailView({ brokerId }: { brokerId: string }) {
  const demo = useDemo();
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [action, setAction] = useState<Action>(null);
  const [openTxn, setOpenTxn] = useState<string | null>(null);
  const [newRate, setNewRate] = useState("35");
  const [attrVendor, setAttrVendor] = useState("");
  const [attrTarget, setAttrTarget] = useState("");

  const data = demo.brokers.find((b) => b.broker.id === brokerId);
  const vendors = useMemo(() => (data ? vendorRows(data) : []), [data]);

  if (!data) {
    return (
      <Card>
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title="Broker not found"
          action={<Button href="/admin/brokers">All Brokers</Button>}
        />
      </Card>
    );
  }

  const s = brokerSummary(data);
  const b = data.broker;
  const account = data.payoutAccount;
  const exceptions = payoutExceptions([data]);
  const audit = demo.auditEvents.filter(
    (e) => e.brokerId === b.id || e.brokerId === null,
  );
  const vendorName = (id: string) =>
    data.vendors.find((v) => v.id === id)?.companyName ?? "";
  const otherBrokers = demo.brokers.filter((x) => x.broker.id !== b.id);
  const paused = b.payoutsPaused;

  const record = (
    action: string,
    summary: string,
    reason: string,
    before: string | null,
    after: string | null,
  ) =>
    demo.recordAudit({
      actor: "Sarah Kim (C2V Admin)",
      action,
      entityType: "Broker",
      entityId: b.id,
      brokerId: b.id,
      summary,
      before,
      after,
      reason,
    });

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/admin/brokers", label: "Brokers" }}
        title={b.companyName}
        description={`${b.city} · affiliate since ${formatDate(b.joinedAt)} · code ${b.referralCode}`}
        meta={
          <>
            <StatusBadge meta={LOGIN_STATUS[b.loginStatus]} size="md" />
            <StatusBadge
              meta={STRIPE_STATUS[account.onboardingStatus]}
              size="md"
            />
            {paused && (
              <StatusBadge
                meta={{
                  label: "Payouts paused",
                  tone: "warning",
                  icon: "pause",
                  help: "Admin paused payouts. Earned commission is unchanged.",
                }}
                size="md"
              />
            )}
          </>
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAction("invite")}
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Resend invitation
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAction("pause")}
            >
              {paused ? (
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
              ) : (
                <PauseCircle className="h-4 w-4" aria-hidden="true" />
              )}
              {paused ? "Resume payouts" : "Pause payouts"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAction("policy")}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Update future policy
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAction("attribution")}
            >
              <Shuffle className="h-4 w-4" aria-hidden="true" />
              Correct attribution
            </Button>
          </>
        }
      />

      {exceptions.map((ex) => (
        <Callout
          key={ex.id}
          tone={ex.severity === "critical" ? "danger" : "warning"}
          title={ex.title}
        >
          {ex.detail} <strong>Recommended:</strong> {ex.recommended}
        </Callout>
      ))}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Connected Agents" value={data.agents.length} />
        <KpiCard label="Referred Vendors" value={s.kpis.referredVendors} />
        <KpiCard label="Active paid Vendors" value={s.kpis.activePaidVendors} />
        <KpiCard
          label="Sep 2026 net commission"
          value={formatMoney(s.currentCommissionCents)}
        />
        <KpiCard
          label="Owed, not yet paid"
          value={formatMoney(s.owedCents)}
          emphasis={s.owedCents > 0}
          sub="Failed or on-hold batches"
        />
      </div>

      <FilterPills
        label="Broker detail sections"
        value={tab}
        onChange={setTab}
        options={[
          { value: "overview", label: "Overview" },
          {
            value: "vendors",
            label: "Referred Vendors",
            count: data.vendors.length,
          },
          {
            value: "ledger",
            label: "Commission ledger",
            count: data.transactions.length,
          },
          {
            value: "payouts",
            label: "Payout batches",
            count: data.payoutBatches.length,
          },
          { value: "audit", label: "Audit events", count: audit.length },
        ]}
      />

      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader title="Profile & access" />
            <div className="px-5 py-2">
              <DescriptionList
                items={[
                  { term: "Primary user", value: data.users[0]?.name ?? "—" },
                  { term: "Email", value: data.users[0]?.email ?? "—" },
                  {
                    term: "Login status",
                    value: <StatusBadge meta={LOGIN_STATUS[b.loginStatus]} />,
                  },
                  {
                    term: "Invitation resent",
                    value: demo.state.resentInviteBrokerIds.includes(b.id)
                      ? "Today (demo)"
                      : "—",
                  },
                  {
                    term: "Referral link",
                    value: (
                      <span className="break-all font-mono text-xs">
                        {b.referralUrl}
                      </span>
                    ),
                  },
                ]}
              />
            </div>
          </Card>
          <Card>
            <CardHeader title="Commission policy" actions={<PolicyBadge />} />
            <div className="px-5 py-2">
              <DescriptionList
                items={[
                  {
                    term: "Rate",
                    value: `${b.defaultCommissionRateBps / 100}%`,
                  },
                  {
                    term: "Duration",
                    value: `${COMMISSION_POLICY.eligibilityMonths} months from first paid`,
                  },
                  {
                    term: "Hold period",
                    value: `${COMMISSION_POLICY.holdDays} days`,
                  },
                  {
                    term: "Payout schedule",
                    value: "Monthly, 5th of following month",
                  },
                  {
                    term: "Minimum payout",
                    value: "Not applied (option: $25)",
                  },
                ]}
              />
            </div>
          </Card>
          <Card>
            <CardHeader title="Stripe Connected Account" />
            <div className="px-5 py-2">
              <DescriptionList
                items={[
                  {
                    term: "Status",
                    value: (
                      <StatusBadge
                        meta={STRIPE_STATUS[account.onboardingStatus]}
                      />
                    ),
                  },
                  {
                    term: "Account",
                    value: (
                      <span className="font-mono text-xs">
                        {account.stripeConnectedAccountId ?? "—"}
                      </span>
                    ),
                  },
                  {
                    term: "Payouts enabled",
                    value: account.payoutsEnabled ? "Yes" : "No",
                  },
                  {
                    term: "Requirements",
                    value: (
                      <span className="text-xs">
                        {account.requirementsStatus}
                      </span>
                    ),
                  },
                  {
                    term: "Bank",
                    value: account.maskedBankDisplay
                      ? `${account.bankName} ${account.maskedBankDisplay}`
                      : "—",
                  },
                  {
                    term: "Last sync",
                    value: formatDateTime(account.lastStatusSyncAt),
                  },
                ]}
              />
            </div>
          </Card>
        </div>
      )}

      {tab === "vendors" && (
        <Card>
          <DataTable
            caption="Referred Vendors"
            rows={vendors}
            rowKey={(r) => r.vendor.id}
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
                key: "reg",
                header: "Registered",
                cell: (r) => formatDate(r.vendor.registeredAt),
              },
              {
                key: "source",
                header: "Source",
                cell: (r) => r.referral.attributionSource.replace("_", " "),
                hideBelow: "md",
              },
              {
                key: "plan",
                header: "Plan",
                cell: (r) =>
                  r.subscription.planId
                    ? PLANS[r.subscription.planId].name
                    : "—",
              },
              {
                key: "status",
                header: "Referral status",
                cell: (r) => (
                  <StatusBadge meta={REFERRAL_STATUS[r.referralStatus]} />
                ),
              },
              {
                key: "commission",
                header: "Commission",
                align: "right",
                cell: (r) => formatMoney(r.lifetimeCommissionCents),
              },
            ]}
          />
        </Card>
      )}

      {tab === "ledger" && (
        <Card>
          <DataTable
            caption="Commission ledger"
            rows={[...data.transactions].reverse()}
            rowKey={(t) => t.id}
            onRowClick={(t) => setOpenTxn(t.id)}
            rowLabel={(t) => `Open ${t.reference}`}
            pageSize={30}
            columns={[
              {
                key: "date",
                header: "Date",
                cell: (t) => formatShortDate(t.earnedAt),
              },
              {
                key: "vendor",
                header: "Vendor",
                cell: (t) => vendorName(t.vendorId),
              },
              {
                key: "type",
                header: "Type",
                cell: (t) => COMMISSION_TYPE[t.type],
              },
              {
                key: "ref",
                header: "Reference",
                cell: (t) => (
                  <span className="font-mono text-xs">{t.reference}</span>
                ),
                hideBelow: "md",
              },
              {
                key: "amount",
                header: "Eligible",
                align: "right",
                cell: (t) => formatMoney(t.eligibleAmountCents),
              },
              {
                key: "commission",
                header: "Commission",
                align: "right",
                cell: (t) => formatMoney(t.commissionCents),
              },
              {
                key: "status",
                header: "Status",
                cell: (t) => <StatusBadge meta={COMMISSION_STATUS[t.status]} />,
              },
            ]}
          />
        </Card>
      )}

      {tab === "payouts" && (
        <Card>
          <DataTable
            caption="Payout batches"
            rows={[...data.payoutBatches].reverse()}
            rowKey={(p) => p.id}
            onRowClick={(p) => router.push(`/admin/payouts/${p.id}`)}
            rowLabel={(p) => `Open ${formatMonth(p.periodMonth)} batch`}
            columns={[
              {
                key: "period",
                header: "Period",
                cell: (p) => formatMonth(p.periodMonth),
              },
              {
                key: "net",
                header: "Net payout",
                align: "right",
                cell: (p) => formatMoney(p.netPayoutCents),
              },
              {
                key: "batch",
                header: "Batch",
                cell: (p) => <StatusBadge meta={BATCH_STATUS[p.batchStatus]} />,
              },
              {
                key: "transfer",
                header: "Transfer",
                cell: (p) => (
                  <StatusBadge meta={TRANSFER_STATUS[p.transferStatus]} />
                ),
              },
              {
                key: "bank",
                header: "Bank payout",
                cell: (p) => (
                  <StatusBadge
                    meta={
                      latestPayoutMeta(p) ?? BANK_STATUS[p.bankPayoutStatus]
                    }
                  />
                ),
              },
              {
                key: "ref",
                header: "Transfer ref",
                cell: (p) => (
                  <span className="font-mono text-xs">
                    {p.stripeTransferReference ?? "—"}
                  </span>
                ),
                hideBelow: "lg",
              },
            ]}
          />
        </Card>
      )}

      {tab === "audit" && (
        <Card>
          <AuditLogTable events={audit} />
        </Card>
      )}

      <CommissionTransactionDrawer
        data={data}
        transaction={data.transactions.find((t) => t.id === openTxn) ?? null}
        onClose={() => setOpenTxn(null)}
        onSelect={setOpenTxn}
        vendorHref={() => `/admin/brokers/${b.id}`}
        payoutHref={(id) => `/admin/payouts/${id}`}
      />

      <ReasonModal
        open={action === "invite"}
        title="Resend Broker invitation"
        description={`Send a new portal invitation and Stripe setup link to ${data.users[0]?.email}.`}
        confirmLabel="Resend invitation"
        onCancel={() => setAction(null)}
        onConfirm={(reason) => {
          demo.resendInvite(b.id);
          record(
            "broker_user.invite_resent",
            `Resent portal invitation to ${data.users[0]?.email}`,
            reason,
            null,
            "Invitation sent",
          );
          setAction(null);
          toast("Invitation resent (simulated) and logged");
        }}
      />
      <ReasonModal
        open={action === "pause"}
        title={paused ? "Resume payouts" : "Pause payouts"}
        danger={!paused}
        description={
          paused
            ? "Future settlements will transfer on schedule again."
            : "Future settlement transfers are held for this Broker. Earned commission and the ledger are not changed."
        }
        confirmLabel={paused ? "Resume payouts" : "Pause payouts"}
        onCancel={() => setAction(null)}
        onConfirm={(reason) => {
          demo.togglePause(b.id);
          record(
            paused ? "payouts.resumed" : "payouts.paused",
            paused ? "Resumed payouts" : "Paused payouts",
            reason,
            paused ? "Paused" : "Active",
            paused ? "Active" : "Paused",
          );
          setAction(null);
          toast(
            paused
              ? "Payouts resumed"
              : "Payouts paused — commission keeps accruing",
          );
        }}
      />
      <ReasonModal
        open={action === "policy"}
        title="Update future commission policy"
        description="Applies to commission earned from the effective date. Past ledger entries never change. The new value needs customer approval before production."
        confirmLabel="Save policy change"
        onCancel={() => setAction(null)}
        onConfirm={(reason) => {
          record(
            "policy.updated",
            `Future commission rate set to ${newRate}% effective Dec 01, 2026`,
            reason,
            `${b.defaultCommissionRateBps / 100}%`,
            `${newRate}% from Dec 01, 2026`,
          );
          setAction(null);
          toast("Policy change recorded in audit log (not applied in demo)");
        }}
      >
        <Select
          label="New commission rate"
          value={newRate}
          onChange={setNewRate}
          options={["25", "30", "35", "40"].map((r) => ({
            value: r,
            label: `${r}%`,
          }))}
        />
      </ReasonModal>
      <ReasonModal
        open={action === "attribution"}
        title="Correct Vendor attribution"
        description="Moves future commission ownership for one Vendor to another Broker. Existing ledger entries stay with the original Broker."
        confirmLabel="Record correction"
        danger
        onCancel={() => setAction(null)}
        onConfirm={(reason) => {
          const vendor =
            data.vendors.find((v) => v.id === attrVendor) ?? data.vendors[0];
          const target =
            demo.brokers.find((x) => x.broker.id === attrTarget) ??
            otherBrokers[0];
          demo.recordAudit({
            actor: "Sarah Kim (C2V Admin)",
            action: "attribution.override",
            entityType: "BrokerVendorReferral",
            entityId: vendor.companyName,
            brokerId: b.id,
            summary: `Moved ${vendor.companyName} from ${b.companyName} to ${target.broker.companyName} (future commission)`,
            before: `${b.companyName} (${b.referralCode})`,
            after: `${target.broker.companyName} (${target.broker.referralCode})`,
            reason,
          });
          setAction(null);
          toast("Attribution correction recorded in the audit log");
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Vendor"
            value={attrVendor || data.vendors[0]?.id || ""}
            onChange={setAttrVendor}
            options={data.vendors
              .slice(0, 40)
              .map((v) => ({ value: v.id, label: v.companyName }))}
          />
          <Select
            label="Move to Broker"
            value={attrTarget || otherBrokers[0]?.broker.id || ""}
            onChange={setAttrTarget}
            options={otherBrokers.map((x) => ({
              value: x.broker.id,
              label: x.broker.companyName,
            }))}
          />
        </div>
      </ReasonModal>
    </div>
  );
}
