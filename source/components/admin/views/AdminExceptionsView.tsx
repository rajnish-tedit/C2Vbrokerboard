"use client";

import { CircleCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  payoutExceptions,
  type PayoutException,
} from "@/components/admin/adminSelectors";
import { ReasonModal } from "@/components/admin/ReasonModal";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DescriptionList } from "@/components/ui/DescriptionList";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatMonth } from "@/lib/domain/dates";
import { formatMoney } from "@/lib/domain/money";
import {
  BANK_STATUS,
  BATCH_STATUS,
  STRIPE_STATUS,
  TRANSFER_STATUS,
} from "@/lib/domain/status";
import { useDemo } from "@/lib/store/DemoProvider";
import { cn } from "@/lib/utils";

export function AdminExceptionsView() {
  const demo = useDemo();
  const toast = useToast();
  const exceptions = payoutExceptions(demo.brokers);
  const [pending, setPending] = useState<{
    ex: PayoutException;
    action: "link" | "pause" | "invite";
  } | null>(null);

  const confirm = (reason: string) => {
    if (!pending) return;
    const { ex, action } = pending;
    const summary =
      action === "link"
        ? `Sent Stripe account-update link for ${ex.brokerName}`
        : action === "invite"
          ? `Resent portal invitation and Stripe setup link to ${ex.brokerName}`
          : `Paused payouts for ${ex.brokerName}`;
    if (action === "pause") demo.togglePause(ex.brokerId);
    if (action === "invite") demo.resendInvite(ex.brokerId);
    demo.recordAudit({
      actor: "Sarah Kim (C2V Admin)",
      action:
        action === "link"
          ? "stripe.update_link_sent"
          : action === "invite"
            ? "broker_user.invite_resent"
            : "payouts.paused",
      entityType: "BrokerPayoutAccount",
      entityId: ex.brokerId,
      brokerId: ex.brokerId,
      summary,
      before: null,
      after: null,
      reason,
    });
    setPending(null);
    toast(`${summary} (simulated) — logged`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stripe / Payout Exceptions"
        description="Only items that need a person. Commission is never recalculated because of a payout problem; the amount stays owed until paid."
      />
      {exceptions.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CircleCheck className="h-5 w-5" />}
            title="No payout exceptions"
            body="All Broker payout accounts are connected and every batch has been paid."
          />
        </Card>
      ) : (
        exceptions.map((ex) => {
          const d = demo.brokers.find((b) => b.broker.id === ex.brokerId)!;
          return (
            <Card
              key={ex.id}
              className={cn(
                ex.severity === "critical"
                  ? "border-rose-200"
                  : "border-amber-200",
              )}
            >
              <CardHeader
                title={
                  <>
                    <TriangleAlert
                      className={cn(
                        "h-4 w-4",
                        ex.severity === "critical"
                          ? "text-rose-600"
                          : "text-amber-600",
                      )}
                      aria-hidden="true"
                    />
                    {ex.brokerName}: {ex.title}
                  </>
                }
                description={
                  ex.severity === "critical"
                    ? "Critical · funds could not reach the Broker's bank"
                    : "Warning · payout cannot start"
                }
                actions={
                  <Link
                    href={`/admin/brokers/${ex.brokerId}`}
                    className="text-xs font-semibold text-navy-700 hover:underline"
                  >
                    Broker detail
                  </Link>
                }
              />
              <div className="grid gap-6 p-5 lg:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-700">{ex.detail}</p>
                  <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                    <strong className="text-navy-950">
                      Recommended action:{" "}
                    </strong>
                    {ex.recommended}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {ex.kind === "on_hold" ? (
                      <Button
                        size="sm"
                        onClick={() => setPending({ ex, action: "invite" })}
                      >
                        Resend invitation & setup link
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setPending({ ex, action: "link" })}
                      >
                        Send Stripe update link
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled
                      title="Stripe retries automatically once the account is fixed"
                    >
                      Retry payout
                    </Button>
                    {!d.broker.payoutsPaused && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPending({ ex, action: "pause" })}
                      >
                        Pause future payouts
                      </Button>
                    )}
                  </div>
                </div>
                <DescriptionList
                  items={[
                    {
                      term: "Amount owed",
                      value: formatMoney(ex.owedCents),
                      emphasis: true,
                    },
                    {
                      term: "Batch",
                      value: ex.batch
                        ? `${formatMonth(ex.batch.periodMonth)} · ${ex.batch.id}`
                        : "—",
                    },
                    {
                      term: "Batch status",
                      value: ex.batch ? (
                        <StatusBadge
                          meta={BATCH_STATUS[ex.batch.batchStatus]}
                        />
                      ) : (
                        "—"
                      ),
                    },
                    {
                      term: "Stripe transfer",
                      value: ex.batch ? (
                        <StatusBadge
                          meta={TRANSFER_STATUS[ex.batch.transferStatus]}
                        />
                      ) : (
                        "—"
                      ),
                    },
                    {
                      term: "Bank payout",
                      value: ex.batch ? (
                        <StatusBadge
                          meta={BANK_STATUS[ex.batch.bankPayoutStatus]}
                        />
                      ) : (
                        "—"
                      ),
                    },
                    {
                      term: "Transfer date",
                      value: formatDate(ex.batch?.transferredAt),
                    },
                    {
                      term: "Payout account",
                      value: (
                        <StatusBadge
                          meta={STRIPE_STATUS[d.payoutAccount.onboardingStatus]}
                        />
                      ),
                    },
                  ]}
                />
              </div>
            </Card>
          );
        })
      )}
      <ReasonModal
        open={pending !== null}
        title={
          pending?.action === "pause"
            ? "Pause future payouts"
            : pending?.action === "invite"
              ? "Resend invitation & setup link"
              : "Send Stripe update link"
        }
        description={`Broker: ${pending?.ex.brokerName ?? ""}. This action is recorded in the audit log.`}
        confirmLabel="Confirm"
        danger={pending?.action === "pause"}
        onCancel={() => setPending(null)}
        onConfirm={confirm}
      />
    </div>
  );
}
