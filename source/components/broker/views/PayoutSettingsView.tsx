"use client";

import {
  CircleCheck,
  CircleX,
  Clock,
  ExternalLink,
  Landmark,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

import {
  SimulatedStripeOnboarding,
  type OnboardingStep,
} from "@/components/broker/SimulatedStripeOnboarding";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Card, CardHeader } from "@/components/ui/Card";
import { DescriptionList } from "@/components/ui/DescriptionList";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatDateTime } from "@/lib/domain/dates";
import { formatMoney } from "@/lib/domain/money";
import { brokerKpis } from "@/lib/domain/selectors";
import { STRIPE_STATUS } from "@/lib/domain/status";
import type { StripeSetupStatus } from "@/lib/domain/types";
import { useDemo } from "@/lib/store/DemoProvider";

function Requirement({ done, label }: { done: boolean; label: string }) {
  const Icon = done ? CircleCheck : CircleX;
  return (
    <li className="flex items-center gap-2 text-sm">
      <Icon
        className={done ? "h-4 w-4 text-emerald-600" : "h-4 w-4 text-rose-500"}
        aria-hidden="true"
      />
      <span className={done ? "text-slate-600" : "font-medium text-navy-950"}>
        {label}
      </span>
      <span className="sr-only">{done ? "complete" : "missing"}</span>
    </li>
  );
}

export function PayoutSettingsView() {
  const demo = useDemo();
  const data = demo.broker;
  const toast = useToast();
  const account = data.payoutAccount;
  const status = account.onboardingStatus;
  const kpis = brokerKpis(data);
  const failedBatch = data.payoutBatches.find(
    (b) => b.bankPayoutStatus === "failed",
  );
  const [onboarding, setOnboarding] = useState<{
    open: boolean;
    step: OnboardingStep;
  }>({ open: false, step: "business" });

  const openOnboarding = (step: OnboardingStep = "business") =>
    setOnboarding({ open: true, step });
  const closeOnboarding = (next?: StripeSetupStatus) => {
    setOnboarding((o) => ({ ...o, open: false }));
    if (!next) return;
    if (demo.state.previewNewBroker) demo.setPreviewNewBroker(false);
    demo.setStripeStatus(next);
    toast(
      next === "connected"
        ? failedBatch
          ? "Payout account updated. Stripe will retry the September payout (simulated)."
          : "Payout account connected. Payouts enabled."
        : next === "under_review"
          ? "Submitted to Stripe for verification"
          : "Progress saved. You can resume setup any time.",
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payout Settings"
        description="Connect and verify a payout account through Stripe so C2V can send your commission automatically. C2V never stores your full bank details."
        meta={<StatusBadge meta={STRIPE_STATUS[status]} size="md" />}
      />

      {failedBatch && (
        <Callout tone="danger" title="Your September bank payout failed">
          {failedBatch.failureReason} Your commission of{" "}
          {formatMoney(failedBatch.netPayoutCents)} is still owed and was not
          recalculated.
        </Callout>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title={
              <>
                <Landmark
                  className="h-4 w-4 text-navy-600"
                  aria-hidden="true"
                />
                Stripe payout account
              </>
            }
          />
          <div className="p-5">
            {status === "not_connected" && (
              <div>
                <p className="text-sm text-slate-600">
                  You don&apos;t have a payout account yet. Commission you earn
                  is still recorded and held for you — it will be paid once
                  setup is complete.
                </p>
                {kpis.availableForPayoutCents + kpis.pendingCommissionCents >
                  0 && (
                  <p className="num mt-3 rounded-lg bg-gold-50 p-3 text-sm text-navy-950">
                    {formatMoney(
                      kpis.availableForPayoutCents +
                        kpis.pendingCommissionCents,
                    )}{" "}
                    of commission is waiting for your payout account.
                  </p>
                )}
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li>
                    • Takes about 5 minutes: business details, identity and bank
                    account
                  </li>
                  <li>• Stripe verifies your information securely</li>
                  <li>
                    • Payouts arrive automatically each month after the 5th
                  </li>
                </ul>
                <Button className="mt-5" onClick={() => openOnboarding()}>
                  Set Up Payout Account
                </Button>
              </div>
            )}

            {status === "incomplete" && (
              <div>
                <p className="text-sm text-slate-600">
                  Stripe still needs the following before payouts can start:
                </p>
                <ul className="mt-3 space-y-2">
                  <Requirement done label="Business details" />
                  <Requirement
                    done={false}
                    label="Identity verification for company representative"
                  />
                  <Requirement done={false} label="Bank account for payouts" />
                </ul>
                <Button
                  className="mt-5"
                  onClick={() => openOnboarding("identity")}
                >
                  Resume Setup
                </Button>
              </div>
            )}

            {status === "under_review" && (
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-navy-950">
                  <Clock className="h-4 w-4 text-sky-600" aria-hidden="true" />
                  Verification in progress
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Stripe is reviewing your identity documents. This usually
                  takes 1–2 business days. Payouts may be unavailable until
                  review completes; your commission keeps accruing.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-5"
                  onClick={() => closeOnboarding("connected")}
                >
                  Demo: simulate Stripe approval
                </Button>
              </div>
            )}

            {(status === "connected" || status === "action_required") && (
              <div>
                {status === "action_required" ? (
                  <Callout
                    tone="danger"
                    title="Action required by Stripe"
                    action={
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => openOnboarding("bank")}
                      >
                        Update payout account
                      </Button>
                    }
                  >
                    {account.requirementsStatus}. Payouts are paused until this
                    is resolved.
                  </Callout>
                ) : (
                  <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    Verified — payouts are enabled and automatic
                  </p>
                )}
                <DescriptionList
                  className="mt-4"
                  items={[
                    {
                      term: "Payout bank account",
                      value: `${account.bankName} ${account.maskedBankDisplay}`,
                    },
                    {
                      term: "Payouts enabled",
                      value: account.payoutsEnabled
                        ? "Yes"
                        : "No — action required",
                    },
                    { term: "Payout schedule", value: account.payoutSchedule },
                    {
                      term: "Connected since",
                      value: formatDate(account.connectedAt),
                    },
                    {
                      term: "Stripe account",
                      value: (
                        <span className="font-mono text-xs">
                          {account.stripeConnectedAccountId}
                        </span>
                      ),
                    },
                    {
                      term: "Last status sync",
                      value: formatDateTime(account.lastStatusSyncAt),
                    },
                  ]}
                />
                {status === "connected" && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => openOnboarding("bank")}
                    >
                      Change bank account
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        toast(
                          "Would open the Stripe Express dashboard (simulated)",
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      Open Stripe dashboard
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title={
              <>
                <Lock className="h-4 w-4 text-navy-600" aria-hidden="true" />
                What C2V stores
              </>
            }
            description="Everything else stays with Stripe"
          />
          <div className="px-5 py-2">
            <DescriptionList
              termClassName="font-mono text-xs"
              items={[
                {
                  term: "stripe_connected_account_id",
                  value: (
                    <span className="font-mono text-xs">
                      {account.stripeConnectedAccountId ?? "—"}
                    </span>
                  ),
                },
                {
                  term: "stripe_onboarding_status",
                  value: STRIPE_STATUS[status].label,
                },
                {
                  term: "payouts_enabled",
                  value: String(account.payoutsEnabled),
                },
                {
                  term: "requirements_status",
                  value: (
                    <span className="text-xs">
                      {account.requirementsStatus}
                    </span>
                  ),
                },
                {
                  term: "connected_at",
                  value: formatDate(account.connectedAt),
                },
                {
                  term: "masked_bank_display",
                  value: account.maskedBankDisplay ?? "—",
                },
              ]}
            />
            <p className="mt-2 pb-3 text-xs text-slate-500">
              Never stored by C2V: full account and routing numbers, SSN, or
              identity documents.
            </p>
          </div>
        </Card>
      </div>

      <SimulatedStripeOnboarding
        open={onboarding.open}
        startAt={onboarding.step}
        companyName={data.broker.companyName}
        onClose={closeOnboarding}
      />
    </div>
  );
}
