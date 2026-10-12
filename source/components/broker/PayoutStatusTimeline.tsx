import { ArrowLeftRight, FileCheck2, Landmark } from "lucide-react";

import { formatDate } from "@/lib/domain/dates";
import { formatMoney } from "@/lib/domain/money";
import {
  BANK_STATUS,
  BATCH_STATUS,
  TRANSFER_STATUS,
} from "@/lib/domain/status";
import type { PayoutBatch } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

import { StatusBadge } from "@/components/ui/StatusBadge";

type StepState = "done" | "failed" | "waiting";

function stepState(ok: boolean, failed: boolean): StepState {
  if (failed) return "failed";
  return ok ? "done" : "waiting";
}

export function PayoutStatusTimeline({
  batch,
  compact,
}: {
  batch: PayoutBatch;
  compact?: boolean;
}) {
  const steps = [
    {
      icon: FileCheck2,
      title: "Commission batch",
      subtitle: "Calculated by C2V from the immutable ledger",
      meta: BATCH_STATUS[batch.batchStatus],
      state: stepState(batch.batchStatus === "finalized", false),
      detail: `${formatMoney(batch.netPayoutCents)} net · finalized ${formatDate(batch.settlementCutoffAt)}`,
    },
    {
      icon: ArrowLeftRight,
      title: "Stripe transfer",
      subtitle: "C2V platform balance → your Stripe payout account",
      meta: TRANSFER_STATUS[batch.transferStatus],
      state: stepState(
        batch.transferStatus === "transferred",
        batch.transferStatus === "failed",
      ),
      detail: batch.transferredAt
        ? `${formatDate(batch.transferredAt)} · ${batch.stripeTransferReference}`
        : (batch.holdReason ?? "Waits for the settlement date"),
    },
    {
      icon: Landmark,
      title: "Bank payout",
      subtitle: "Your Stripe payout account → your bank",
      meta: BANK_STATUS[batch.bankPayoutStatus],
      state: stepState(
        batch.bankPayoutStatus === "paid",
        batch.bankPayoutStatus === "failed",
      ),
      detail:
        batch.bankPayoutStatus === "paid"
          ? `Arrived ${formatDate(batch.bankPaidAt)} · ${batch.bankPayoutReference}`
          : batch.bankPayoutStatus === "failed"
            ? (batch.failureReason ?? "Bank rejected the payout")
            : batch.bankPayoutExpectedAt
              ? `Expected ${formatDate(batch.bankPayoutExpectedAt)}`
              : "Starts after the transfer",
    },
  ];

  return (
    <ol className={cn("relative", compact ? "space-y-4" : "space-y-6")}>
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <li key={step.title} className="relative flex gap-4">
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-[17px] top-10 w-0.5",
                  compact ? "h-[calc(100%-1.5rem)]" : "h-[calc(100%-1rem)]",
                  step.state === "done" ? "bg-emerald-300" : "bg-slate-200",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white",
                step.state === "done" && "bg-emerald-50 text-emerald-600",
                step.state === "failed" && "bg-rose-50 text-rose-600",
                step.state === "waiting" && "bg-slate-100 text-slate-500",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-navy-950">
                  {step.title}
                </p>
                <StatusBadge meta={step.meta} />
              </div>
              {!compact && (
                <p className="text-xs text-slate-500">{step.subtitle}</p>
              )}
              <p
                className={cn(
                  "mt-1 text-sm",
                  step.state === "failed" ? "text-rose-700" : "text-slate-600",
                )}
              >
                {step.detail}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
